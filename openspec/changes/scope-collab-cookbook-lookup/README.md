# scope-collab-cookbook-lookup

Retrofit collabCookbookIds lookup in context.ts: scope it to cookbooks router (lazy, not eager in every request) and fail loud with a retry-friendly TRPCError instead of unconditionally propagating a raw exception. Resolves #677.
