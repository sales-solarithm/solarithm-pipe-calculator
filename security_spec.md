# Security Specification: Pipe Calculator Persistence

## 1. Data Invariants
- Each project in `/pipe_calculator_projects/{projectId}` has an immutable `userId` bound to `request.auth.uid`.
- Creation requires valid authentication and `incoming().userId == request.auth.uid`.
- Reads (`get` and `list`) require `isSignedIn()` and `resource.data.userId == request.auth.uid`.
- Updates require `incoming().userId == existing().userId` and `incoming().createdAt == existing().createdAt`.
- Timestamps: `createdAt` matches `request.time` on create; `updatedAt` matches `request.time` on update.
- Strings have strict length boundaries (projectName <= 200, noteText <= 500, logoUrl <= 2048).
- Arrays have size bounds (`pipeSizes.size() <= 20`, `components.size() <= 50`, `rows.size() <= 100`).

## 2. Dirty Dozen Threat Vectors Blocked
1. Unauthenticated write attempt -> Blocked by `isSignedIn()`.
2. Impersonation on create (`userId: "victim_123"`) -> Blocked by `incoming().userId == request.auth.uid`.
3. Reading another user's project (`get`) -> Blocked by `resource.data.userId == request.auth.uid`.
4. Listing all projects without owner filter (`list`) -> Blocked by query enforcer `resource.data.userId == request.auth.uid`.
5. Modifying owner during update -> Blocked by `incoming().userId == existing().userId`.
6. Modifying `createdAt` during update -> Blocked by `incoming().createdAt == existing().createdAt`.
7. Massive string injection (Denial of Wallet) -> Blocked by `val.size() <= MAX`.
8. Massive array injection -> Blocked by `.size() <= MAX`.
9. Document ID path poisoning -> Blocked by `isValidId(projectId)`.
10. Deleting another user's project -> Blocked by `resource.data.userId == request.auth.uid`.
11. Spoofing timestamps with arbitrary client dates -> Blocked by `request.time` verification.
12. Random wildcard collections access -> Blocked by default-deny catch-all.
