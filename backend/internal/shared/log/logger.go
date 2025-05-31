package log

type Logger interface {
	Debugf(tmp string, args ...any)
	Infof(tmp string, args ...any)
	Warnf(tmp string, args ...any)
	Errorf(tmp string, args ...any)
	Fatalf(tmp string, args ...any)
	Panicf(tmp string, args ...any)
}
