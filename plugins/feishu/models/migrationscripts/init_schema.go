package migrationscripts

import (
	"context"

	"github.com/merico-dev/lake/plugins/feishu/models/migrationscripts/archived"
	"gorm.io/gorm"
)

type InitSchemas struct{}

func (*InitSchemas) Up(_ context.Context, db *gorm.DB) error {
	return db.Migrator().AutoMigrate(
		&archived.FeishuMeetingTopUserItem{},
	)
}

func (*InitSchemas) Version() uint64 {
	return 20220407201134
}

func (*InitSchemas) Name() string {
	return "Feishu init schemas"
}
