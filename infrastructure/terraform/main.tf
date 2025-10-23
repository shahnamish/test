terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

resource "aws_cloudwatch_log_group" "security_audit" {
  name              = "/application/security/audit"
  retention_in_days = 2555 # 7 years
}

resource "aws_cloudwatch_metric_alarm" "high_failed_login" {
  alarm_name          = "HighFailedLoginAttempts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "failed_login_attempts_total"
  namespace           = "Security"
  period              = 300
  statistic           = "Sum"
  threshold           = 50
  alarm_description   = "High number of failed login attempts detected"
  datapoints_to_alarm = 1

  alarm_actions = [
    aws_sns_topic.security_alerts.arn
  ]
}

resource "aws_sns_topic" "security_alerts" {
  name = "security-alerts"
}

resource "aws_sns_topic_subscription" "security_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.security_alert_email
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "security_alert_email" {
  description = "Security team distribution email"
  type        = string
  default     = "security@example.com"
}
