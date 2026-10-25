# Working on this repo

## Review loop

Every PR goes through this loop before Noah looks at it:

1. The coding AI opens a PR and watches it (PR activity subscription).
2. The **AI review** workflow (`.github/workflows/ai-review.yml`) reviews each push.
   It approves, or requests changes with inline comments.
3. On "changes requested", the coding AI fixes every blocking comment, replies on
   each thread, and pushes. The push triggers a new review. Nits marked
   "non-blocking" are optional.
4. Repeat until the AI review approves and the **Build** check is green.
5. Then tell Noah the PR is ready. Noah does the final review and merges.
   Never merge or auto-merge a PR yourself.

If the reviewer asks for something that is wrong or out of scope, reply on the
thread explaining why instead of changing the code.
