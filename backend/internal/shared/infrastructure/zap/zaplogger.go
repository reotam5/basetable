package zap

import (
	"fmt"
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type Logger struct {
	logger *zap.SugaredLogger
}

type LogLevel int

const (
	logLevelDebug LogLevel = iota
	logLevelInfo
	logLevelWarn
	logLevelError
	logLevelFatal
	logLevelPanic
)

func LogLevelFromString(level string) LogLevel {
	switch level {
	case "debug":
		return logLevelDebug
	case "info":
		return logLevelInfo
	case "warn":
		return logLevelWarn
	case "error":
		return logLevelError
	case "fatal":
		return logLevelFatal
	case "panic":
		return logLevelPanic
	default:
		return logLevelInfo // Default to info if unknown level
	}
}

type Config struct {
	ServiceName string
	ServiceID   string
	LogLevel    LogLevel
	LogFileName string
}

func NewLogger(cfg Config) *Logger {
	serviceName := cfg.ServiceName
	serviceID := cfg.ServiceID
	logFileName := cfg.LogFileName
	if logFileName == "" {
		logFileName = fmt.Sprintf("%s-%s.log", serviceName, serviceID)
	}

	var logLevel zapcore.Level
	switch cfg.LogLevel {
	case logLevelDebug:
		logLevel = zapcore.DebugLevel
	case logLevelInfo:
		logLevel = zapcore.InfoLevel
	case logLevelWarn:
		logLevel = zapcore.WarnLevel
	case logLevelError:
		logLevel = zapcore.ErrorLevel
	case logLevelFatal:
		logLevel = zapcore.FatalLevel
	case logLevelPanic:
		logLevel = zapcore.PanicLevel
	}

	config := zap.NewProductionEncoderConfig()
	config.TimeKey = "@timestamp"
	config.MessageKey = "message"
	config.LevelKey = "log.level"
	config.EncodeTime = zapcore.ISO8601TimeEncoder
	fileEncoder := zapcore.NewJSONEncoder(config)
	consoleEncoder := zapcore.NewConsoleEncoder(config)
	logFile, _ := os.OpenFile(logFileName, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)

	logFields := zap.Fields(
		zap.String("service.name", serviceName),
		zap.String("service.id", serviceID),
	)
	core := zapcore.NewTee(
		zapcore.NewCore(fileEncoder, zapcore.AddSync(logFile), logLevel),
		zapcore.NewCore(consoleEncoder, zapcore.AddSync(os.Stdout), logLevel),
	)
	logger := zap.New(core, zap.AddCaller(), zap.AddStacktrace(zapcore.ErrorLevel), logFields)
	return &Logger{
		logger: logger.Sugar(),
	}
}

func (l *Logger) Debugf(tmp string, args ...any) {
	l.logger.Debugf(tmp, args...)
}

func (l *Logger) Infof(tmp string, args ...any) {
	l.logger.Infof(tmp, args...)
}

func (l *Logger) Warnf(tmp string, args ...any) {
	l.logger.Warnf(tmp, args...)
}

func (l *Logger) Errorf(tmp string, args ...any) {
	l.logger.Errorf(tmp, args...)
}

func (l *Logger) Fatalf(tmp string, args ...any) {
	l.logger.Fatalf(tmp, args...)
}

func (l *Logger) Panicf(tmp string, args ...any) {
	l.logger.Panicf(tmp, args...)
}
