# Architecture and design decisions

MySQL owns identities, relationships, constraints, availability, appointment transactions, and clinical-note access metadata. ChromaDB stores only the vector index and minimal note metadata; note content is resolved and authorization-checked by the API in a production deployment. This avoids using a vector index as a source of truth.

The scheduling service uses row locks and a single transaction. It validates doctor-clinic association, future and ordered timestamps, doctor and room overlap, and aggregate equipment quantity before inserting the appointment and allocations.
