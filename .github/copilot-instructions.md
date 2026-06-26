# AI Reviewer Workflow & Requirements

As an AI reviewer on this repository, you must adhere strictly to the following workflow to ensure auto-merge behaves correctly while you are processing the changes:

## 1. The "Review in Progress" Lock (CRITICAL)
**Your very first action upon being triggered MUST be to post a standalone PR comment.** 
* You must post this comment *before* you spend time analyzing the code or drafting your full review.
* The comment should explicitly state: `"🤖 AI Review in Progress. Please do not merge yet."`
* This acts as a lock to prevent auto-merge from triggering while you are still generating your review.

## 2. Conduct a High-Quality Review
Once the lock comment is posted, conduct a thorough and meticulous review of the pull request. Focus on the following high-quality review standards:

* **Security & Reliability:** Identify any potential security vulnerabilities, unhandled exceptions, race conditions, or memory leaks.
* **Performance:** Point out inefficient algorithms, unnecessary database queries, or bloated renders.
* **Maintainability:** Ensure the code adheres to clean code principles. Look for proper naming conventions, modularity, and readable logic.
* **Edge Cases:** Think outside the "happy path." Are null values, empty arrays, or unexpected user inputs handled safely?
* **Actionable Feedback:** When suggesting changes, provide clear, constructive feedback and include code snippets showing the corrected implementation. Do not nitpick on subjective stylistic choices unless they violate established patterns in the surrounding file.

## 3. Release the Lock
**After you have fully completed your review** (including submitting all inline comments and your overall approval/request for changes):
* You MUST remove the initial "Review in Progress" comment you posted in Step 1.
* You can do this by either **deleting** the comment or **resolving** the comment thread. 
* This signals to the repository that your review is complete and auto-merge is safe to proceed.
