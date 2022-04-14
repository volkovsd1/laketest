package tasks

import (
	"net/http"

	"github.com/merico-dev/lake/plugins/github/utils"

	"github.com/merico-dev/lake/plugins/helper"
)

func GetTotalPagesFromResponse(res *http.Response, _ *helper.ApiCollectorArgs) (int, error) {
	link := res.Header.Get("link")
	pageInfo, err := utils.GetPagingFromLinkHeader(link)
	if err != nil {
		return 0, nil
	}
	return pageInfo.Last, nil
}
