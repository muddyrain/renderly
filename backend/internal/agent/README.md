# Agent module
Owns intent interpretation, structured plans, approval gates, bounded tool execution, and run events.
Must not execute SQL, read provider credentials, or call provider-specific HTTP directly.
First milestone: typed CreativeBrief, Plan, Step, RunState plus validation and unit tests.
