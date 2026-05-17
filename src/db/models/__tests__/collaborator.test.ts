// @vitest-environment node
import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { Collaborator } from "@/db/models";

function makeIds() {
  return {
    cookbookId: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    addedBy: new Types.ObjectId(),
  };
}

describe("Collaborator model — schema validation", () => {
  it("saves a valid collaborator with role 'editor'", async () => {
    await withCleanDb(async () => {
      const { cookbookId, userId, addedBy } = makeIds();
      const doc = await new Collaborator({ cookbookId, userId, role: "editor", addedBy }).save();
      expect(doc.role).toBe("editor");
    });
  });

  it("saves a valid collaborator with role 'viewer'", async () => {
    await withCleanDb(async () => {
      const { cookbookId, userId, addedBy } = makeIds();
      const doc = await new Collaborator({ cookbookId, userId, role: "viewer", addedBy }).save();
      expect(doc.role).toBe("viewer");
    });
  });

  it("rejects an invalid role value", async () => {
    await withCleanDb(async () => {
      const { cookbookId, userId, addedBy } = makeIds();
      const doc = new Collaborator({ cookbookId, userId, role: "admin", addedBy });
      await expect(doc.save()).rejects.toThrow();
    });
  });

  it("requires cookbookId", async () => {
    await withCleanDb(async () => {
      const { userId, addedBy } = makeIds();
      const doc = new Collaborator({ userId, role: "editor", addedBy });
      await expect(doc.save()).rejects.toThrow();
    });
  });

  it("requires userId", async () => {
    await withCleanDb(async () => {
      const { cookbookId, addedBy } = makeIds();
      const doc = new Collaborator({ cookbookId, role: "viewer", addedBy });
      await expect(doc.save()).rejects.toThrow();
    });
  });

  it("sets addedAt to a date by default", async () => {
    await withCleanDb(async () => {
      const { cookbookId, userId, addedBy } = makeIds();
      const doc = await new Collaborator({ cookbookId, userId, role: "editor", addedBy }).save();
      expect(doc.addedAt).toBeInstanceOf(Date);
    });
  });
});

describe("Collaborator model — unique constraint", () => {
  it("throws on duplicate cookbookId + userId pair", async () => {
    await withCleanDb(async () => {
      const { cookbookId, userId, addedBy } = makeIds();
      await new Collaborator({ cookbookId, userId, role: "editor", addedBy }).save();
      const dup = new Collaborator({ cookbookId, userId, role: "viewer", addedBy });
      await expect(dup.save()).rejects.toMatchObject({ code: 11000 });
    });
  });

  it("allows same userId on different cookbooks", async () => {
    await withCleanDb(async () => {
      const { userId, addedBy } = makeIds();
      const cb1 = new Types.ObjectId();
      const cb2 = new Types.ObjectId();
      await new Collaborator({ cookbookId: cb1, userId, role: "editor", addedBy }).save();
      const doc = await new Collaborator({ cookbookId: cb2, userId, role: "viewer", addedBy }).save();
      expect(doc.cookbookId.toString()).toBe(cb2.toString());
    });
  });

  it("allows same cookbookId with different userIds", async () => {
    await withCleanDb(async () => {
      const { cookbookId, addedBy } = makeIds();
      const u1 = new Types.ObjectId();
      const u2 = new Types.ObjectId();
      await new Collaborator({ cookbookId, userId: u1, role: "editor", addedBy }).save();
      const doc = await new Collaborator({ cookbookId, userId: u2, role: "viewer", addedBy }).save();
      expect(doc.userId.toString()).toBe(u2.toString());
    });
  });
});
