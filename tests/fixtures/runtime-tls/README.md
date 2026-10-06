These are public, disposable self-signed TLS fixtures for a loopback Node test.
The private key is intentionally shared test data and protects no real service.
Only the test's temporary HTTPS agent trusts the certificate. Application TLS
verification and machine trust stores are unchanged.

The `.fixture` extension lets these exact disposable files travel with the test
suite while the repository continues to ignore general `.pem` key material.
