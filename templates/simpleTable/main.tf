variable "environment" {
  description = "The deployment environment"
}

module "config" {
  source      = "<%= configPath %>"
}

module "simple_table" {
  source = "github.com/slswt/modules//data_stores/ddb/simple_table"
  table_name = "<%= tableName %>"
  read_capacity = 1
  write_capacity = 1
  ddb_table_name_prefix="${module.config.ddb_table_name_prefix}"
}
