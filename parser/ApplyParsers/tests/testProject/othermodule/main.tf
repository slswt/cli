module "table" {
  source         = "github.com/slswt/modules//data_stores/ddb/simple_table"
  read_capacity  = 3
  write_capacity = 3
}

module "analytics_table" {
  source         = "github.com/slswt/modules//data_stores/ddb/simple_table"
  read_capacity  = 3
  write_capacity = 3
  id             = "analytics_table"
}
