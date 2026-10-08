# PowerShell Auto Ship & Deploy Helper Script for QtdYenTho-HRM
param (
    [string]$Message = "",
    [switch]$All
)

$allFlag = if ($All) { "--all" } else { "" }
if ($Message -ne "") {
    node scripts/ship.js "$Message" $allFlag
} else {
    node scripts/ship.js $allFlag
}
