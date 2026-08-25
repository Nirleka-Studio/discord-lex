# Commit Standards

## Commit prefixes

| Prefix             | Description                                       |
|--------------------|---------------------------------------------------|
| `feat(...): ...`   | A brand new law has been passed.                  |
| `amend(...): ...`  | Modification to an existing law.                  |
| `repeal(...): ...` | Deleting a law or provision.                      |
| `insert(...): ...` | Inserting new article(s) into an existing law.    |
| `fix(...): ...`    | Minor patch, such as grammar or cross-references. |

## Amendments
An amendment is any substantive modification of law. This does not include rewording or fixing typos. Wording changes that may alter interpretation is also classified as an amendment.

The following commit prefixes must lead to a change in the version number and `last_amended` metadata:
* `amend`;
* `repeal`; and
* `insert`.

