package domain

type MCPSettings struct {
	command   string
	arguments []string
	env       map[string]string
}

func NewMCPSettings(command string, arguments []string, env map[string]string) MCPSettings {
	return MCPSettings{
		command:   command,
		arguments: arguments,
		env:       env,
	}
}

func (m MCPSettings) Command() string {
	return m.command
}

func (m MCPSettings) Arguments() []string {
	return m.arguments
}

func (m MCPSettings) Env() map[string]string {
	return m.env
}
