# Known Issues

1. A way to verify that books are actually stored in the S3 location, because books can
   get displayed when there is no file in S3.

2. A way to identify a book so the same one does not get added twice. `books` has nothing
   stable to match on, and a title is not enough because two different editions can
   share one.

3. Which book fields are required and which can be missing has not been fully sorted. In the schema, I made `title`, `language` and
   `license`required and allowed the others to permit a `NULL` value. I made this decision when I wrote the tables, 
   not from the requirements. A book can have no cover and still work. But if it has no description, it cannot be found when someone searches by description.
