package handlers

import (
	"net/http"
	"os"
	"time"

	"blankapp/database"
	"blankapp/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte(getEnvOrDefault("JWT_SECRET", "change-this-secret-in-production"))

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

type AuthRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

type UserResponse struct {
	ID    uint   `json:"id"`
	Email string `json:"email"`
}

func Register(c *gin.Context) {
	// Check if registration is disabled
	if os.Getenv("DISABLE_REGISTRATION") == "true" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Registration is disabled"})
		return
	}

	// Check if any users already exist (only one user allowed)
	var count int64
	if err := database.DB.Model(&models.User{}).Count(&count).Error; err == nil && count > 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Registration is disabled because an admin user already exists."})
		return
	}

	var req AuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user exists
	var existingUser models.User
	if result := database.DB.Where("email = ?", req.Email).First(&existingUser); result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	user := models.User{
		Email:    req.Email,
		Password: string(hashedPassword),
	}

	if result := database.DB.Create(&user); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Generate token
	token, err := generateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, AuthResponse{
		Token: token,
		User: UserResponse{
			ID:    user.ID,
			Email: user.Email,
		},
	})
}

func Login(c *gin.Context) {
	var req AuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user
	var user models.User
	if result := database.DB.Where("email = ?", req.Email).First(&user); result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate token
	token, err := generateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, AuthResponse{
		Token: token,
		User: UserResponse{
			ID:    user.ID,
			Email: user.Email,
		},
	})
}

func generateToken(userID uint) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
	})

	return token.SignedString(jwtSecret)
}

func HasUsers(c *gin.Context) {
	var count int64
	if err := database.DB.Model(&models.User{}).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"has_users": count > 0})
}
