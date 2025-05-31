package zap

import (
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type ZapLogger struct {
	logger *zap.SugaredLogger
}

func NewZapLogger(serviceName, serviceID, logFileName string) *ZapLogger {
	config := zap.NewProductionEncoderConfig()
	config.TimeKey = "@timestamp"
	config.MessageKey = "message"
	config.LevelKey = "log.level"
	config.EncodeTime = zapcore.ISO8601TimeEncoder
	fileEncoder := zapcore.NewJSONEncoder(config)
	consoleEncoder := zapcore.NewConsoleEncoder(config)
	logFile, _ := os.OpenFile(logFileName, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	defaultLogLevel := zapcore.DebugLevel
	logFields := zap.Fields(
		zap.String("service.name", serviceName),
		zap.String("service.id", serviceID),
	)
	core := zapcore.NewTee(
		zapcore.NewCore(fileEncoder, zapcore.AddSync(logFile), defaultLogLevel),
		zapcore.NewCore(consoleEncoder, zapcore.AddSync(os.Stdout), defaultLogLevel),
	)
	logger := zap.New(core, zap.AddCaller(), zap.AddStacktrace(zapcore.ErrorLevel), logFields)
	return &ZapLogger{
		logger: logger.Sugar(),
	}
}

func (zl *ZapLogger) Debugf(tmp string, args ...any) {
	zl.logger.Debugf(tmp, args...)
}

func (zl *ZapLogger) Infof(tmp string, args ...any) {
	zl.logger.Infof(tmp, args...)
}

func (zl *ZapLogger) Warnf(tmp string, args ...any) {
	zl.logger.Warnf(tmp, args...)
}

func (zl *ZapLogger) Errorf(tmp string, args ...any) {
	zl.logger.Errorf(tmp, args...)
}

func (zl *ZapLogger) Fatalf(tmp string, args ...any) {
	zl.logger.Fatalf(tmp, args...)
}

func (zl *ZapLogger) Panicf(tmp string, args ...any) {
	zl.logger.Panicf(tmp, args...)
}
