package main

import (
	"log"
	"net/http"
	"os"

	"thirsti-tracker/database"
	"thirsti-tracker/handlers"
	"thirsti-tracker/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database
	database.InitDB()

	// Create router
	r := gin.Default()

	// CORS middleware
	r.Use(middleware.CorsMiddleware())

	// Serve static frontend files
	r.Static("/assets", "./static/assets")
	r.StaticFile("/favicon.ico", "./static/favicon.ico")

	// API routes
	api := r.Group("/api")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.GET("/has-users", handlers.HasUsers)
		}

		// Public
		api.GET("/dashboard", handlers.GetDashboard)
		api.GET("/analytics", handlers.GetAnalytics)
		
		// Submission page endpoints (protected by query ?code)
		machine := api.Group("/machine")
		{
			machine.GET("/settings", handlers.GetMachineSettings)
			machine.POST("/dispense", handlers.Dispense)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// Admin endpoints
			protected.GET("/admin/inventory", handlers.GetInventory)
			protected.POST("/admin/co2/purchase", handlers.PurchaseCO2)
			protected.POST("/admin/co2/install", handlers.InstallCO2)
			protected.DELETE("/admin/co2/:id", handlers.DeleteCO2)
			protected.PUT("/admin/co2/:id", handlers.UpdateCO2)

			protected.POST("/admin/flavor/purchase", handlers.PurchaseFlavor)
			protected.POST("/admin/flavor/install/:id", handlers.InstallFlavor)
			protected.DELETE("/admin/flavor/:id", handlers.DeleteFlavor)
			protected.PUT("/admin/flavor/:id", handlers.UpdateFlavor)

			protected.POST("/admin/code", handlers.GenerateCode)
			protected.GET("/admin/code", handlers.GetCode)

			protected.GET("/theme/colors", handlers.GetThemeColors)
			protected.POST("/theme/colors", handlers.SetThemeColors)
		}
	}

	// Serve frontend for all other routes (SPA support)
	r.NoRoute(func(c *gin.Context) {
		c.File("./static/index.html")
	})

	// Get port from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
