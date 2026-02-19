using Microsoft.Extensions.DependencyInjection;
using backend.Services;
using backend.Services.Interfaces;

namespace backend.Extensions;

public static class ServiceCollectionExtensions {
  public static IServiceCollection AddApplicaitonServices(this IServiceCollection services) {
    // services.AddScoped<ITodoService, TodoService>();
    return services;
  }
}

