#!/bin/sh
# Generates a throwaway CA, a server certificate for localhost, and a client
# certificate for Devin E. Loper, for trying the nginx setup locally.
set -e
cd "$(dirname "$0")"
mkdir -p certs
cd certs

openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout ca.key -out ca.crt -subj "/CN=Example Dev CA"

openssl req -newkey rsa:2048 -nodes -keyout server.key -out server.csr -subj "/CN=localhost"
printf "subjectAltName=DNS:localhost" > server.ext
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -days 365 -extfile server.ext -out server.crt

openssl req -newkey rsa:2048 -nodes -keyout devin.key -out devin.csr \
  -subj "/C=US/O=Example/OU=Development/CN=Devin E. Loper"
openssl x509 -req -in devin.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -days 365 -out devin.crt
openssl pkcs12 -export -in devin.crt -inkey devin.key -out devin.p12 -passout pass:devin

rm -f ./*.csr server.ext ca.srl
echo "wrote nginx/certs (import devin.p12 into your browser, password: devin)"
