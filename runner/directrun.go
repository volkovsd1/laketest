package runner

import (
	"context"

	"github.com/merico-dev/lake/config"
	"github.com/merico-dev/lake/logger"
	"github.com/merico-dev/lake/plugins/core"
	"github.com/spf13/cobra"
)

func RunCmd(cmd *cobra.Command) {
	cmd.Flags().StringSliceP("tasks", "t", nil, "specify what tasks to run, --tasks=collectIssues,extractIssues")
	err := cmd.Execute()
	if err != nil {
		panic(err)
	}
}

func DirectRun(cmd *cobra.Command, _ []string, pluginTask core.PluginTask, options map[string]interface{}) {
	tasks, err := cmd.Flags().GetStringSlice("tasks")
	if err != nil {
		panic(err)
	}
	options["tasks"] = tasks
	cfg := config.GetConfig()
	log := logger.Global.Nested(cmd.Use)
	db, err := NewGormDb(cfg, log)
	if err != nil {
		panic(err)
	}
	if pluginInit, ok := pluginTask.(core.PluginInit); ok {
		err = pluginInit.Init(cfg, log, db)
		if err != nil {
			panic(err)
		}
	}
	err = core.RegisterPlugin(cmd.Use, pluginTask.(core.PluginMeta))
	if err != nil {
		panic(err)
	}
	err = RunPluginSubTasks(
		cfg,
		log,
		db,
		context.Background(),
		cmd.Use,
		options,
		pluginTask,
		nil,
	)
	if err != nil {
		panic(err)
	}
}
