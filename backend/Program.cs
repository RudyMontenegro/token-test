using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;
using Microsoft.OpenApi.Models;
using Microsoft.EntityFrameworkCore;
using backende.Data;
using backende.Models;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

// Configurar Entity Framework Core con MySQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Configurar CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add services to the container.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

builder.Services.AddAuthorization();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "API con Microsoft SSO", Version = "v1" });
    
    // Configuración para Swagger con autenticación OAuth2
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header usando el esquema Bearer. Ejemplo: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Asegurar que la base de datos esté creada
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        dbContext.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        // Log error si la base de datos no se puede crear
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error al crear la base de datos");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Usar CORS
app.UseCors("AllowFrontend");

// Middleware de autenticación y autorización
app.UseAuthentication();
app.UseAuthorization();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

// Endpoint público (sin autenticación)
app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast")
.WithOpenApi();

// Endpoint protegido (requiere autenticación)
app.MapGet("/api/protected", () =>
{
    return Results.Ok(new { message = "Este es un endpoint protegido. Solo usuarios autenticados pueden acceder." });
})
.RequireAuthorization()
.WithName("GetProtectedData")
.WithOpenApi();

// Endpoint para obtener información del usuario autenticado
app.MapGet("/api/me", async (ClaimsPrincipal user, ApplicationDbContext dbContext) =>
{
    var email = user.FindFirst(ClaimTypes.Email)?.Value 
        ?? user.FindFirst("preferred_username")?.Value
        ?? user.FindFirst("email")?.Value;
    
    var objectId = user.FindFirst("oid")?.Value 
        ?? user.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value;
    
    var name = user.FindFirst(ClaimTypes.Name)?.Value 
        ?? user.FindFirst("name")?.Value
        ?? email;

    if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(objectId))
    {
        return Results.BadRequest(new { message = "No se pudo obtener la información del usuario" });
    }

    // Buscar o crear usuario en la base de datos
    var dbUser = await dbContext.Users
        .FirstOrDefaultAsync(u => u.AzureAdObjectId == objectId || u.Email == email);

    if (dbUser == null)
    {
        dbUser = new User
        {
            Email = email,
            Name = name ?? email,
            AzureAdObjectId = objectId,
            CreatedAt = DateTime.UtcNow,
            LastLoginAt = DateTime.UtcNow
        };
        dbContext.Users.Add(dbUser);
    }
    else
    {
        // Actualizar información si es necesario
        if (dbUser.Email != email) dbUser.Email = email;
        if (dbUser.Name != name && !string.IsNullOrEmpty(name)) dbUser.Name = name;
        if (dbUser.AzureAdObjectId != objectId) dbUser.AzureAdObjectId = objectId;
        dbUser.LastLoginAt = DateTime.UtcNow;
    }

    await dbContext.SaveChangesAsync();

    var claims = user.Claims.Select(c => new { c.Type, c.Value }).ToList();
    return Results.Ok(new 
    { 
        message = "Información del usuario autenticado",
        user = new
        {
            id = dbUser.Id,
            email = dbUser.Email,
            name = dbUser.Name,
            lastLoginAt = dbUser.LastLoginAt
        },
        claims = claims,
        isAuthenticated = user.Identity?.IsAuthenticated ?? false
    });
})
.RequireAuthorization()
.WithName("GetUserInfo")
.WithOpenApi();

// Endpoint para validar token (útil para el frontend)
app.MapPost("/api/auth/validate", async (HttpContext context, ApplicationDbContext dbContext) =>
{
    if (!context.User.Identity?.IsAuthenticated ?? true)
    {
        return Results.Unauthorized();
    }

    var user = context.User;
    var email = user.FindFirst(ClaimTypes.Email)?.Value 
        ?? user.FindFirst("preferred_username")?.Value
        ?? user.FindFirst("email")?.Value;
    
    var objectId = user.FindFirst("oid")?.Value 
        ?? user.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value;

    if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(objectId))
    {
        return Results.BadRequest(new { message = "Token inválido" });
    }

    var dbUser = await dbContext.Users
        .FirstOrDefaultAsync(u => u.AzureAdObjectId == objectId || u.Email == email);

    return Results.Ok(new 
    { 
        isValid = true,
        user = dbUser != null ? new
        {
            id = dbUser.Id,
            email = dbUser.Email,
            name = dbUser.Name
        } : null
    });
})
.RequireAuthorization()
.WithName("ValidateToken")
.WithOpenApi();

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
