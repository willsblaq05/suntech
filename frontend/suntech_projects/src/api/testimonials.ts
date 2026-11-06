/**
 * Admin testimonial API calls against the backend surface:
 *
 *   GET    /api/v1/testimonials            (admin — list incl. status)
 *   POST   /api/v1/testimonials            (admin — record a story)
 *   PATCH  /api/v1/testimonials/{id}       (admin — edit text / approve/reject)
 *   POST   /api/v1/testimonials/{id}/photo (admin — sanitised photo upload)
 *   DELETE /api/v1/testimonials/{id}       (admin — remove row + photo file)
 */

import type { Testimonial, TestimonialStatus } from "../types/admin";
import { adminFetch, ApiError } from "./session";

export interface TestimonialInput {
  name: string;
  location: string;
  project_type: string;
  quote: string;
}

const MAX_UPLOAD_MB = 5;

export async function fetchTestimonials(): Promise<Testimonial[]> {
  const response = await adminFetch("/api/v1/testimonials/?limit=100");
  if (!response.ok) {
    throw new ApiError(response.status, "Could not load testimonials. Please try again.");
  }
  return (await response.json()) as Testimonial[];
}

export async function createTestimonial(input: TestimonialInput): Promise<Testimonial> {
  const response = await adminFetch("/api/v1/testimonials/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new ApiError(response.status, "Could not save the testimonial. Please try again.");
  }
  return (await response.json()) as Testimonial;
}

export async function uploadTestimonialPhoto(
  id: string,
  file: File,
): Promise<Testimonial> {
  // Client-side pre-check so huge phone photos fail fast with a clear
  // message before the caller waits on a network round trip.
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    throw new ApiError(413, `Image is too large (max ${MAX_UPLOAD_MB} MB).`);
  }

  const body = new FormData();
  body.append("photo", file);
  const response = await adminFetch(`/api/v1/testimonials/${id}/photo`, {
    method: "POST",
    body, // browser sets the multipart boundary
  });
  if (!response.ok) {
    if (response.status === 415) {
      throw new ApiError(415, "Only JPEG, PNG, or WebP images are supported.");
    }
    throw new ApiError(response.status, "Photo upload failed. Please try again.");
  }
  return (await response.json()) as Testimonial;
}

export async function updateTestimonial(
  id: string,
  patch: Partial<TestimonialInput> & { status?: TestimonialStatus },
): Promise<Testimonial> {
  const response = await adminFetch(`/api/v1/testimonials/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw new ApiError(response.status, "Update failed. Please try again.");
  }
  return (await response.json()) as Testimonial;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const response = await adminFetch(`/api/v1/testimonials/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new ApiError(response.status, "Delete failed. Please try again.");
  }
}
