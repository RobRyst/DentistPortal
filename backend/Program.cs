using System.Security.Claims;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.OpenApi.Models;

using backend.Infrastructure.Data;
using backend.Domains.Entities;
using backend.Domains.Interfaces;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);

// ------------------ EF Core ------------------
var connection = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connection, ServerVersion.AutoDetect(connection)));

// ------------------ Identity ------------------
builder.Services.AddIdentityCore<AppUser>(options =>
{
    options.User.RequireUniqueEmail = true;

    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireDigit = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
    options.Password.RequiredLength = 6;

    options.Lockout.AllowedForNewUsers = false;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddSignInManager<SignInManager<AppUser>>();

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

// ------------------ Authentication (JWT) ------------------
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
            ),
            NameClaimType = JwtRegisteredClaimNames.Sub,
            RoleClaimType = ClaimTypes.Role
        };
    });

// ------------------ Authorization ------------------
builder.Services.AddAuthorization();

// ------------------ App services ------------------
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<TokenService>();

builder.Services.AddHttpContextAccessor();

// ------------------ Mailtrap (Email via SMTP) ------------------
builder.Services.Configure<MailTrapOptions>(builder.Configuration.GetSection("MailtrapSmtp"));
builder.Services.AddScoped<IEmailSender, EmailService>();
builder.Services.AddScoped<TwoFactorAuthService>();
builder.Services.Configure<TwilioOptions>(builder.Configuration.GetSection("Twilio"));

bool twilioConfigured =
    !string.IsNullOrWhiteSpace(builder.Configuration["Twilio:AccountSid"]) &&
    !string.IsNullOrWhiteSpace(builder.Configuration["Twilio:AuthToken"])  &&
    !string.IsNullOrWhiteSpace(builder.Configuration["Twilio:FromNumber"]);

if (twilioConfigured)
{
    builder.Services.AddHttpClient<ITextMessageService, TextMessageService>();
}
else
{
    builder.Services.AddSingleton<ITextMessageService, DevSmsSender>();
}


// ------------------ CORS ------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ------------------ Swagger & Controllers ------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "RystDentist API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Example: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference
            { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
    });
});

var app = builder.Build();

// ------------------ Seed roles ------------------
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    foreach (var role in new[] { "Admin", "Provider", "Patient" })
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("CorsPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
