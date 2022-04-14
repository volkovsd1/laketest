package migrationscripts

import (
	"context"

	"github.com/merico-dev/lake/plugins/jenkins/models/migrationscripts/archived"
	"gorm.io/gorm"
)

type InitSchemas struct{}

func (*InitSchemas) Up(_ context.Context, db *gorm.DB) error {
	return db.Migrator().AutoMigrate(
		&archived.JenkinsJob{},
		&archived.JenkinsBuild{},
	)
}

func (*InitSchemas) Version() uint64 {
	return 20220407201137
}

func (*InitSchemas) Name() string {
	return "Jenkins init schemas"
}
