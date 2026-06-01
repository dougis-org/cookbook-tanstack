// @vitest-environment node
import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { Notification } from "@/db/models";
import {
  seedUserWithBetterAuth,
  makeAuthCaller,
  makeAnonCaller,
} from "./test-helpers";

describe("notifications tRPC router", () => {
  it("rejects unauthorized access for unreadCount, list, and markRead", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      await expect(caller.notifications.unreadCount()).rejects.toThrow("UNAUTHORIZED");
      await expect(caller.notifications.list()).rejects.toThrow("UNAUTHORIZED");
      await expect(caller.notifications.markRead({ id: new Types.ObjectId().toString() })).rejects.toThrow("UNAUTHORIZED");
    });
  });

  it("returns correct count in unreadCount query", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth();
      const sender = await seedUserWithBetterAuth();
      const caller = await makeAuthCaller(user.id, { email: user.email });

      // Count should start at 0
      const initialCount = await caller.notifications.unreadCount();
      expect(initialCount).toBe(0);

      // Create two unread notifications and one read notification
      await new Notification({
        userId: new Types.ObjectId(user.id),
        senderId: new Types.ObjectId(sender.id),
        type: "collaboration_invited",
        read: false,
      }).save();

      await new Notification({
        userId: new Types.ObjectId(user.id),
        senderId: new Types.ObjectId(sender.id),
        type: "recipe_added",
        read: false,
      }).save();

      await new Notification({
        userId: new Types.ObjectId(user.id),
        senderId: new Types.ObjectId(sender.id),
        type: "recipe_removed",
        read: true,
      }).save();

      const newCount = await caller.notifications.unreadCount();
      expect(newCount).toBe(2);
    });
  });

  it("lists the 10 most recent notifications with populated sender details", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth();
      const senderObj = await seedUserWithBetterAuth();
      const caller = await makeAuthCaller(user.id, { email: user.email });

      const senderId = new Types.ObjectId(senderObj.id);
      const userId = new Types.ObjectId(user.id);

      // Create 12 notifications
      for (let i = 0; i < 12; i++) {
        await new Notification({
          userId,
          senderId,
          type: "recipe_added",
          data: {
            cookbookTitle: `Cookbook ${i}`,
          },
          // Stagger the creation time
          createdAt: new Date(Date.now() + i * 1000),
        }).save();
      }

      const list = await caller.notifications.list();
      expect(list).toHaveLength(10);
      
      // Sorted by createdAt descending, so index 0 is Cookbook 11
      expect(list[0].data?.cookbookTitle).toBe("Cookbook 11");
      expect(list[9].data?.cookbookTitle).toBe("Cookbook 2");

      // Verify populated sender details
      expect(list[0].sender).toBeDefined();
      expect(list[0].sender.id).toBe(senderObj.id);
      expect(list[0].sender.name).toBe(senderObj.name);
      expect(list[0].sender.email).toBe(senderObj.email);
    });
  });

  it("marks a specific notification as read", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth();
      const sender = await seedUserWithBetterAuth();
      const caller = await makeAuthCaller(user.id, { email: user.email });

      const notification = await new Notification({
        userId: new Types.ObjectId(user.id),
        senderId: new Types.ObjectId(sender.id),
        type: "collaboration_invited",
        read: false,
      }).save();

      const updated = await caller.notifications.markRead({ id: notification._id.toString() });
      expect(updated.success).toBe(true);

      const dbDoc = await Notification.findById(notification._id);
      expect(dbDoc?.read).toBe(true);
    });
  });

  it("marks all notifications as read if no ID is passed", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth();
      const sender = await seedUserWithBetterAuth();
      const caller = await makeAuthCaller(user.id, { email: user.email });

      await new Notification({
        userId: new Types.ObjectId(user.id),
        senderId: new Types.ObjectId(sender.id),
        type: "collaboration_invited",
        read: false,
      }).save();

      await new Notification({
        userId: new Types.ObjectId(user.id),
        senderId: new Types.ObjectId(sender.id),
        type: "recipe_added",
        read: false,
      }).save();

      const updated = await caller.notifications.markRead({});
      expect(updated.success).toBe(true);

      const unreadCount = await Notification.countDocuments({ userId: new Types.ObjectId(user.id), read: false });
      expect(unreadCount).toBe(0);
    });
  });
});
