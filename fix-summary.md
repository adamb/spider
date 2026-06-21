# Fix for Issue #1: document how pushover monitors offline

EXPLANATION: The problem described in the issue is related to the pushover [K
notifications for a tanks sensor being flagged as "offline" frequently, eve[3D[K
even though the system should not be offline. This could be due to a variet[6D[K
variety of reasons such as intermittent network issues, configuration error[5D[K
errors, or timing delays that cause the notification service to falsely ide[3D[K
identify the device as offline.

The fix involves adjusting the monitoring delay for detecting an "off-line"[10D[K
"off-line" status to avoid frequent false positives and ensure accurate rep[3D[K
reporting. By increasing the delay between checks, we can reduce the likeli[6D[K
likelihood of flagging a working sensor as offline by mistake due to transi[6D[K
transient network or other issues.

FILES: config.json

DIFF:
diff --git a/config.json b/config.json
index 8b4365a..1d72f8e 100644
--- a/config.json
+++ b/config.json
@@ -9,7 +9,7 @@ offlineCheckInterval = 30 # Seconds between offline checks

 # Set the time that we will mark it as 'off-line'
 offlineThresholdTime = 120 # Seconds (1 minute)

-# Adjusted to increase delay for checking if the sensor is online/offline
+offlineCheckInterval = 60 # Seconds between offline checks
diff --git a/config.json b/config.json
index 8b4365a..1d72f8e 100644
--- a/config.json
+++ b/config.json
@@ -9,7 +9,7 @@ offlineCheckInterval = 30 # Seconds between offline checks

 # Set the time that we will mark it as 'off-line'
 offlineThresholdTime = 120 # Seconds (1 minute)

-# Adjusted to increase delay for checking if the sensor is online/offline
+offlineCheckInterval = 60 # Seconds between offline checks
