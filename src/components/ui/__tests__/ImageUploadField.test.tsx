import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import ImageUploadField from "../ImageUploadField";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function makeImageFile(name = "recipe.jpg", size = 1024) {
  return new File([new Uint8Array(size)], name, { type: "image/jpeg" });
}

function makeTextFile() {
  return new File(["not image"], "recipe.txt", { type: "text/plain" });
}

async function uploadAndWaitForPreview(file = makeImageFile()) {
  await userEvent.upload(screen.getByLabelText(/click to upload/i), file);
  return screen.findByRole("img", { name: /recipe image preview/i });
}

function deferredResponse() {
  let resolve!: (value: Response) => void;
  const promise = new Promise<Response>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function renderControlled({
  initialValue = null,
  initialUrl = null,
  onUpload = vi.fn(),
  onRemove = vi.fn(),
}: {
  initialValue?: string | null;
  initialUrl?: string | null;
  onUpload?: (url: string, fileId: string) => void;
  onRemove?: () => void;
} = {}) {
  function Harness() {
    const [value, setValue] = useState<string | null>(initialValue);

    return (
      <ImageUploadField
        value={value}
        initialUrl={initialUrl}
        onUpload={(url, fileId) => {
          onUpload(url, fileId);
          setValue(url);
        }}
        onRemove={() => {
          onRemove();
          setValue(null);
        }}
      />
    );
  }

  return render(<Harness />);
}

describe("ImageUploadField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("renders an idle upload prompt without a preview", () => {
    renderControlled();

    expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows uploading state and then renders a preview after upload succeeds", async () => {
    const pending = deferredResponse();
    const onUpload = vi.fn();
    fetchMock.mockReturnValueOnce(pending.promise);
    renderControlled({ onUpload });

    await userEvent.upload(
      screen.getByLabelText(/click to upload/i),
      makeImageFile(),
    );

    expect(screen.getByText(/uploading/i)).toBeInTheDocument();

    pending.resolve(
      jsonResponse({
        url: "https://ik.imagekit.io/demo/recipe.jpg",
        fileId: "file-1",
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole("img", { name: /recipe image preview/i }))
        .toHaveAttribute("src", "https://ik.imagekit.io/demo/recipe.jpg");
    });
    expect(onUpload).toHaveBeenCalledWith(
      "https://ik.imagekit.io/demo/recipe.jpg",
      "file-1",
    );
  });

  it("shows an error and skips fetch when the selected file is over 10 MB", async () => {
    renderControlled();

    await userEvent.upload(
      screen.getByLabelText(/click to upload/i),
      makeImageFile("large.jpg", 11 * 1024 * 1024),
    );

    expect(screen.getByText("File must be under 10 MB")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows an error and skips fetch when the selected file type is unsupported", async () => {
    renderControlled();

    await userEvent.upload(
      screen.getByLabelText(/click to upload/i),
      makeTextFile(),
      { applyAccept: false },
    );

    expect(
      screen.getByText("File must be a JPEG, PNG, WebP, or GIF image"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows an error without a preview when upload fails", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "Upload failed" }, { status: 500 }),
    );
    renderControlled();

    await userEvent.upload(
      screen.getByLabelText(/click to upload/i),
      makeImageFile(),
    );

    await waitFor(() => {
      expect(screen.getByText("Upload failed")).toBeInTheDocument();
    });
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("deletes a pending upload when Remove is clicked", async () => {
    const onRemove = vi.fn();
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          url: "https://ik.imagekit.io/demo/pending.jpg",
          fileId: "pending-1",
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ success: true }));
    renderControlled({ onRemove });

    await uploadAndWaitForPreview();
    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/upload/pending-1", {
        method: "DELETE",
        keepalive: true,
      });
    });
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(onRemove).toHaveBeenCalled();
  });

  it("removes an existing saved image without deleting from ImageKit", async () => {
    const onRemove = vi.fn();
    renderControlled({
      initialValue: "https://ik.imagekit.io/demo/existing.jpg",
      initialUrl: "https://ik.imagekit.io/demo/existing.jpg",
      onRemove,
    });

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(onRemove).toHaveBeenCalled();
  });

  it("opens the file picker when Change is clicked", async () => {
    const inputClick = vi.spyOn(HTMLInputElement.prototype, "click");
    renderControlled({
      initialValue: "https://ik.imagekit.io/demo/existing.jpg",
      initialUrl: "https://ik.imagekit.io/demo/existing.jpg",
    });

    await userEvent.click(screen.getByRole("button", { name: /change/i }));

    expect(inputClick).toHaveBeenCalled();
    inputClick.mockRestore();
  });

  it("deletes the first pending upload before replacing it", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          url: "https://ik.imagekit.io/demo/a.jpg",
          fileId: "file-a",
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ success: true }))
      .mockResolvedValueOnce(
        jsonResponse({
          url: "https://ik.imagekit.io/demo/b.jpg",
          fileId: "file-b",
        }),
      );
    renderControlled();

    await uploadAndWaitForPreview(makeImageFile("a.jpg"));
    await userEvent.upload(screen.getByLabelText(/change recipe image/i), makeImageFile("b.jpg"));

    await waitFor(() => {
      expect(screen.getByRole("img", { name: /recipe image preview/i }))
        .toHaveAttribute("src", "https://ik.imagekit.io/demo/b.jpg");
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/upload/file-a",
      { method: "DELETE", keepalive: true },
    );
  });

  it("continues replacement upload when deleting the previous pending upload fails", async () => {
    const onUpload = vi.fn();
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          url: "https://ik.imagekit.io/demo/a.jpg",
          fileId: "file-a",
        }),
      )
      .mockRejectedValueOnce(new Error("delete failed"))
      .mockResolvedValueOnce(
        jsonResponse({
          url: "https://ik.imagekit.io/demo/b.jpg",
          fileId: "file-b",
        }),
      );
    renderControlled({ onUpload });

    await uploadAndWaitForPreview(makeImageFile("a.jpg"));
    await userEvent.upload(screen.getByLabelText(/change recipe image/i), makeImageFile("b.jpg"));

    await waitFor(() => {
      expect(screen.getByRole("img", { name: /recipe image preview/i }))
        .toHaveAttribute("src", "https://ik.imagekit.io/demo/b.jpg");
    });
    expect(onUpload).toHaveBeenLastCalledWith(
      "https://ik.imagekit.io/demo/b.jpg",
      "file-b",
    );
  });

  it("removes pending preview when pending delete fails", async () => {
    const onRemove = vi.fn();
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          url: "https://ik.imagekit.io/demo/pending.jpg",
          fileId: "pending-1",
        }),
      )
      .mockRejectedValueOnce(new Error("delete failed"));
    renderControlled({ onRemove });

    await uploadAndWaitForPreview();
    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    await waitFor(() => {
      expect(onRemove).toHaveBeenCalled();
    });
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("clears pending state when parent restores the saved image URL", async () => {
    function Harness() {
      const [value, setValue] = useState<string | null>(
        "https://ik.imagekit.io/demo/existing.jpg",
      );

      return (
        <>
          <ImageUploadField
            value={value}
            initialUrl="https://ik.imagekit.io/demo/existing.jpg"
            onUpload={(url) => setValue(url)}
            onRemove={() => setValue(null)}
          />
          <button
            type="button"
            onClick={() => setValue("https://ik.imagekit.io/demo/existing.jpg")}
          >
            Revert
          </button>
        </>
      );
    }

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        url: "https://ik.imagekit.io/demo/pending.jpg",
        fileId: "pending-1",
      }),
    );
    render(<Harness />);

    const input = screen.getByLabelText(/change recipe image/i);
    await userEvent.upload(input, makeImageFile());
    await screen.findByRole("img", { name: /recipe image preview/i });

    await userEvent.click(screen.getByRole("button", { name: /revert/i }));
    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
