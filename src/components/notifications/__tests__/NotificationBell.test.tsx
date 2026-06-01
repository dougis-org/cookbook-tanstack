import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock values that can be updated in individual tests
let mockUnreadCount = 0;
let mockList = [] as any[];
const mockMarkReadMutation = vi.fn().mockResolvedValue({ success: true });
const mockNavigate = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    notifications: {
      unreadCount: {
        queryOptions: () => ({
          queryKey: ["notifications", "unreadCount"],
          queryFn: () => Promise.resolve(mockUnreadCount),
          path: () => ["notifications", "unreadCount"],
        }),
        path: () => ["notifications", "unreadCount"],
      },
      list: {
        queryOptions: () => ({
          queryKey: ["notifications", "list"],
          queryFn: () => Promise.resolve(mockList),
          path: () => ["notifications", "list"],
        }),
        path: () => ["notifications", "list"],
      },
      markRead: {
        mutationOptions: () => ({
          mutationFn: (input: any) => mockMarkReadMutation(input),
          path: () => ["notifications", "markRead"],
        }),
        path: () => ["notifications", "markRead"],
      },
    },
  },
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

import NotificationBell from "../NotificationBell";
import { formatTimeAgo } from "../NotificationDropdown";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("NotificationBell Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnreadCount = 0;
    mockList = [];
  });

  it("Test Case 5.2 — Hide Badge when Zero", async () => {
    mockUnreadCount = 0;
    renderWithProviders(<NotificationBell />);

    // Unread badge element should not be rendered
    const badge = screen.queryByText("0");
    expect(badge).toBeNull();
    
    const unreadBadgeEl = document.getElementById("unread-badge");
    expect(unreadBadgeEl).toBeNull();
  });

  it("Test Case 5.1 — Unread Badge Render when count > 0", async () => {
    mockUnreadCount = 5;
    renderWithProviders(<NotificationBell />);

    // Wait for the query to resolve and verify badge is rendered
    await waitFor(() => {
      const badge = screen.getByText("5");
      expect(badge).toBeInTheDocument();
    });
  });

  it("Test Case 5.3 — Dropdown Toggle when clicked", async () => {
    mockUnreadCount = 3;
    mockList = [
      {
        id: "n1",
        userId: "u1",
        senderId: "s1",
        type: "collaboration_invited",
        read: false,
        data: {
          cookbookId: "cb1",
          cookbookTitle: "Healthy Eats",
        },
        sender: {
          id: "s1",
          name: "Alice",
          email: "alice@example.com",
        },
        createdAt: new Date(),
      },
    ];

    renderWithProviders(<NotificationBell />);

    // Dropdown should be closed initially
    expect(document.getElementById("notification-dropdown")).toBeNull();

    // Click the bell to open
    const button = screen.getByRole("button", { name: /toggle notifications/i });
    fireEvent.click(button);

    // Dropdown should now be rendered
    await waitFor(() => {
      expect(document.getElementById("notification-dropdown")).toBeInTheDocument();
      expect(screen.getByText(/invited you to collaborate/i)).toBeInTheDocument();
    });

    // Click again to close
    fireEvent.click(button);
    expect(document.getElementById("notification-dropdown")).toBeNull();
  });

  it("Test Case 5.4 — Notification Navigation and marking as read", async () => {
    mockUnreadCount = 1;
    mockList = [
      {
        id: "n1",
        userId: "u1",
        senderId: "s1",
        type: "recipe_added",
        read: false,
        data: {
          cookbookId: "cb1",
          cookbookTitle: "Tasty Pasta",
          recipeId: "r1",
          recipeTitle: "Carbonara",
        },
        sender: {
          id: "s1",
          name: "Bob",
          email: "bob@example.com",
        },
        createdAt: new Date(),
      },
    ];

    renderWithProviders(<NotificationBell />);

    // Open dropdown
    const button = screen.getByRole("button", { name: /toggle notifications/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/to the cookbook/i)).toBeInTheDocument();
    });

    // Click the notification card
    const notifCard = screen.getByText(/to the cookbook/i);
    fireEvent.click(notifCard);

    // Should mutate markRead
    await waitFor(() => {
      expect(mockMarkReadMutation).toHaveBeenCalledWith({ id: "n1" });
    });

    // Should close dropdown
    expect(document.getElementById("notification-dropdown")).toBeNull();

    // Should navigate to cookbook detail
    expect(mockNavigate).toHaveBeenCalled();
    expect(mockNavigate.mock.calls[0][0].to).toBe("/cookbooks/cb1");
  });

  it("Test Case 5.5 — formatTimeAgo handles various time intervals", () => {
    const now = Date.now();
    expect(formatTimeAgo(new Date(now - 10 * 1000))).toBe("just now");
    expect(formatTimeAgo(new Date(now - 5 * 60 * 1000))).toBe("5m ago");
    expect(formatTimeAgo(new Date(now - 3 * 3600 * 1000))).toBe("3h ago");
    expect(formatTimeAgo(new Date(now - 2 * 24 * 3600 * 1000))).toBe("2d ago");
  });

  it("Test Case 5.6 — click-outside logic closes the tray", async () => {
    mockUnreadCount = 1;
    mockList = [
      {
        id: "n1",
        userId: "u1",
        senderId: "s1",
        type: "collaboration_invited",
        read: false,
        data: { cookbookId: "cb1" },
        createdAt: new Date(),
      },
    ];

    renderWithProviders(<NotificationBell />);

    // Click the bell to open the dropdown
    const button = screen.getByRole("button", { name: /toggle notifications/i });
    fireEvent.click(button);

    // Dropdown should be in the document
    await waitFor(() => {
      expect(document.getElementById("notification-dropdown")).toBeInTheDocument();
    });

    // Fire mousedown on document.body (outside containerRef)
    fireEvent.mouseDown(document.body);

    // Dropdown should be closed
    await waitFor(() => {
      expect(document.getElementById("notification-dropdown")).toBeNull();
    });
  });

  it("Test Case 5.7 — 'Mark all as read' button click logic", async () => {
    mockUnreadCount = 2;
    mockList = [
      {
        id: "n1",
        userId: "u1",
        senderId: "s1",
        type: "collaboration_invited",
        read: false,
        data: { cookbookId: "cb1" },
        createdAt: new Date(),
      },
      {
        id: "n2",
        userId: "u1",
        senderId: "s2",
        type: "recipe_added",
        read: false,
        data: { cookbookId: "cb1" },
        createdAt: new Date(),
      },
    ];

    renderWithProviders(<NotificationBell />);

    // Open dropdown
    const button = screen.getByRole("button", { name: /toggle notifications/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /mark all read/i })).toBeInTheDocument();
    });

    // Click 'Mark all read'
    const markAllBtn = screen.getByRole("button", { name: /mark all read/i });
    fireEvent.click(markAllBtn);

    // Should mutate markRead with empty object
    await waitFor(() => {
      expect(mockMarkReadMutation).toHaveBeenCalledWith({});
    });
  });

  it("Test Case 5.8 — rendering logic for all notification types", async () => {
    mockUnreadCount = 3;
    mockList = [
      {
        id: "n1",
        userId: "u1",
        senderId: "s1",
        type: "collaboration_removed",
        read: false,
        data: {
          cookbookId: "cb1",
          cookbookTitle: "Healthy Eats",
        },
        sender: {
          id: "s1",
          name: "Alice",
          email: "alice@example.com",
        },
        createdAt: new Date(),
      },
      {
        id: "n2",
        userId: "u1",
        senderId: "s2",
        type: "recipe_removed",
        read: false,
        data: {
          cookbookId: "cb1",
          cookbookTitle: "Tasty Pasta",
          recipeId: "r1",
          recipeTitle: "Carbonara",
        },
        sender: {
          id: "s2",
          name: "Bob",
          email: "bob@example.com",
        },
        createdAt: new Date(),
      },
    ];

    renderWithProviders(<NotificationBell />);

    // Open dropdown
    const button = screen.getByRole("button", { name: /toggle notifications/i });
    fireEvent.click(button);

    await waitFor(() => {
      // For collaboration_removed
      expect(screen.getByText(/Your collaboration on the cookbook/i)).toBeInTheDocument();
      // For recipe_removed
      expect(screen.getByText(/removed/i)).toBeInTheDocument();
      expect(screen.getByText(/from the cookbook/i)).toBeInTheDocument();
    });
  });
});
