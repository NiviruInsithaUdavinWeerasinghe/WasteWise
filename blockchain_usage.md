# Blockchain Usage in WasteWise

In the **WasteWise** project, blockchain technology is used to ensure the **authenticity** and **integrity** of the Green Certificates issued to users. Here is a simple breakdown of how it works:

### 1. The "Digital Fingerprint" (Hashing)
When a buyer confirms they have received waste material, the system creates a unique **SHA-256 cryptographic hash**. Think of this as a "digital fingerprint" that is unique to that specific transaction.

This fingerprint is created using:
*   **Listing ID**: The unique record of the waste item.
*   **Seller ID**: Who provided the material.
*   **Weight**: How much material was recycled.
*   **Timestamp**: Exactly when the transaction was completed.

### 2. The Verification Hash
This hash is stored in the database and printed directly onto the **Green Certificate** (PDF) under the section **"BLOCKCHAIN VERIFICATION HASH"**. 

Because even a tiny change in the transaction data (like changing 100kg to 101kg) would result in a completely different hash, this ensures that the certificate cannot be tampered with or forged.

### 3. Circular Economy Protocol
While the current system uses high-level cryptography to simulate blockchain immutability, it follows a **Circular Economy Protocol**. This means:
*   **Immutability**: Once the certificate is generated, its data is "locked" by the hash.
*   **Transparency**: Anyone with the certificate can verify the transaction against the platform's records using the unique hash.
*   **Trust**: Businesses can prove their sustainability impact (CO2 saved) with a verified, secure record.

### How to Verify a Certificate
You can verify any Green Certificate in three simple steps:

1.  **Locate the IDs**: On the certificate, find the **Audit Reference ID** (e.g., `65F...`) and the **Blockchain Verification Hash**.
2.  **Query the Platform**: Access the platform's public record by visiting:
    `http://localhost:5000/api/listings/[Audit-Reference-ID]`
3.  **Cross-Check**: Compare the `verificationId` in the database response with the hash on your certificate. 

**If they match exactly**, the certificate is authentic. If the data had been tampered with or if the certificate was fake, the hashes would not match, and the verification would fail.

### Why use this instead of a traditional database?
Traditional databases can be edited. By using a **Verification Hash**, WasteWise adds a layer of security that mimics a blockchain ledger, ensuring that every Green Certificate is a permanent, verifiable record of environmental impact.
