#!/usr/bin/env bash

# Execute a Clerk Backend API request with scope enforcement.
#
# Usage: bash execute-request.sh [--admin] <METHOD> <PATH> [BODY]
#
# Scope enforcement:
#   GET     — always allowed
#   POST, PUT, PATCH — requires CLERK_BAPI_SCOPES="write" or --admin flag
#   DELETE  — requires CLERK_BAPI_SCOPES="write,delete" or --admin flag

set -euo pipefail

# Only these may be set from a .env file. A discovered .env is untrusted input:
# it is parsed, never executed, and anything outside this list is ignored so a
# stray file cannot inject PATH/proxy/TLS settings into the curl call below.
#
# CLERK_REST_API_URL is deliberately NOT on this list. It selects the host that
# receives CLERK_SECRET_KEY, so a .env discovered by walking up from $PWD must
# never be able to set it. It is honored only from the caller's own environment,
# and only after passing the approved-host check below.
_ALLOWED_ENV_KEYS="CLERK_SECRET_KEY CLERK_BAPI_SCOPES"

# Snapshot the caller-supplied base URL before any .env file is read.
_CALLER_REST_API_URL="${CLERK_REST_API_URL:-}"

# Read KEY=VALUE pairs from a file without invoking the shell on its contents.
_load_env_file() {
  local _file="$1" _line _key _val
  while IFS= read -r _line || [[ -n "$_line" ]]; do
    _line="${_line%$'\r'}"                     # tolerate CRLF files
    _line="${_line#"${_line%%[![:space:]]*}"}" # trim leading whitespace
    [[ -z "$_line" || "$_line" == \#* ]] && continue
    _line="${_line#export }"
    [[ "$_line" == *=* ]] || continue
    _key="${_line%%=*}"
    [[ "$_key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    [[ " $_ALLOWED_ENV_KEYS " == *" $_key "* ]] || continue
    _val="${_line#*=}"
    _val="${_val%"${_val##*[![:space:]]}"}"    # trim trailing whitespace
    # Strip one layer of matching surrounding quotes. The value is then assigned
    # verbatim -- no expansion, no command substitution.
    if [[ "$_val" == \"*\" ]]; then
      _val="${_val:1:${#_val}-2}"
    elif [[ "$_val" == \'*\' ]]; then
      _val="${_val:1:${#_val}-2}"
    fi
    printf -v "$_key" '%s' "$_val"
    export "$_key"
  done < "$_file"
}

# Walk up from $PWD to find .env/.env.local (mirrors Clerk CLI behavior).
# Stops at the first directory that provides CLERK_SECRET_KEY.
_dir="$PWD"
while true; do
  for _envfile in "$_dir/.env" "$_dir/.env.local"; do
    if [[ -f "$_envfile" ]]; then
      _load_env_file "$_envfile"
    fi
  done
  [[ -n "${CLERK_SECRET_KEY:-}" ]] && break
  _parent="$(dirname "$_dir")"
  [[ "$_parent" == "$_dir" ]] && break
  _dir="$_parent"
done
unset _dir _parent _envfile _ALLOWED_ENV_KEYS
unset -f _load_env_file

# Parse --admin flag
ADMIN=false
if [[ "${1:-}" == "--admin" ]]; then
  ADMIN=true
  shift
fi

METHOD="${1:?Usage: execute-request.sh [--admin] <METHOD> <PATH> [BODY]}"
PATH_ARG="${2:?Usage: execute-request.sh [--admin] <METHOD> <PATH> [BODY]}"
BODY="${3:-}"

METHOD_UPPER=$(echo "$METHOD" | tr '[:lower:]' '[:upper:]')
SCOPES="${CLERK_BAPI_SCOPES:-}"

# Scope check
if [[ "$ADMIN" == false ]]; then
  case "$METHOD_UPPER" in
    GET)
      ;; # always allowed
    POST|PUT|PATCH)
      if [[ "$SCOPES" != *"write"* ]]; then
        echo "ERROR: $METHOD_UPPER requests require CLERK_BAPI_SCOPES=\"write\" or --admin flag." >&2
        echo "Current CLERK_BAPI_SCOPES: \"$SCOPES\"" >&2
        exit 1
      fi
      ;;
    DELETE)
      if [[ "$SCOPES" != *"write"* ]] || [[ "$SCOPES" != *"delete"* ]]; then
        echo "ERROR: DELETE requests require CLERK_BAPI_SCOPES=\"write,delete\" or --admin flag." >&2
        echo "Current CLERK_BAPI_SCOPES: \"$SCOPES\"" >&2
        exit 1
      fi
      ;;
    *)
      echo "ERROR: Unknown HTTP method: $METHOD_UPPER" >&2
      exit 1
      ;;
  esac
fi

# Base URL: default to production. A caller-supplied CLERK_REST_API_URL is
# accepted only if it is a bare https origin on an approved Clerk host -- no
# userinfo, port, path or query -- because this host receives the secret key.
_APPROVED_API_HOSTS="api.clerk.com api.clerkstage.dev"

BASE_URL="https://api.clerk.com"
if [[ -n "$_CALLER_REST_API_URL" ]]; then
  _candidate="${_CALLER_REST_API_URL%/}"
  _host="${_candidate#https://}"
  if [[ "$_candidate" == "$_host" ]] || [[ " $_APPROVED_API_HOSTS " != *" $_host "* ]]; then
    echo "ERROR: CLERK_REST_API_URL=\"$_CALLER_REST_API_URL\" is not an approved Clerk API origin." >&2
    echo "Approved values: https://api.clerk.com, https://api.clerkstage.dev" >&2
    exit 1
  fi
  BASE_URL="$_candidate"
fi
unset _CALLER_REST_API_URL _APPROVED_API_HOSTS _candidate _host

# Build curl command
CURL_ARGS=(
  -s
  -X "$METHOD_UPPER"
  "${BASE_URL}/v1${PATH_ARG}"
  -H "Authorization: Bearer ${CLERK_SECRET_KEY:?CLERK_SECRET_KEY is not set}"
  -H "Content-Type: application/json"
)

if [[ -n "$BODY" ]]; then
  CURL_ARGS+=(-d "$BODY")
fi

curl "${CURL_ARGS[@]}"
