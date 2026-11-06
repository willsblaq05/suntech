"""Admin-managed, verified customer testimonials."""
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_admin
from app.core.media import delete_image, save_image
from app.models.testimonial import TestimonialStatus
from app.schemas.testimonial import (
    TestimonialCreate,
    TestimonialPublicRead,
    TestimonialRead,
    TestimonialUpdate,
)
from app.services.testimonial_service import TestimonialService

router = APIRouter(prefix="/testimonials", tags=["testimonials"])

AdminPrincipal = Depends(get_current_admin)


@router.get(
    "/public",
    response_model=list[TestimonialPublicRead],
    summary="Approved testimonials for the website (public)",
)
def public_testimonials(
    limit: int = Query(default=12, ge=1, le=50),
    session: Session = Depends(get_session),
) -> list[TestimonialPublicRead]:
    """Only published (approved) stories are served — the honest subset."""
    service = TestimonialService(session)
    return service.list_public(limit=limit)


@router.post(
    "/",
    response_model=TestimonialRead,
    status_code=201,
    dependencies=[AdminPrincipal],
    summary="Record a verified testimonial (admin)",
)
def create_testimonial(
    *,
    session: Session = Depends(get_session),
    data_in: TestimonialCreate,
) -> TestimonialRead:
    """New stories always start ``pending`` — nothing is public by default."""
    service = TestimonialService(session)
    return service.create_testimonial(data_in)


@router.get(
    "/",
    response_model=list[TestimonialRead],
    dependencies=[AdminPrincipal],
    summary="List testimonials and their workflow status (admin)",
)
def list_testimonials(
    status: TestimonialStatus | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session),
) -> list[TestimonialRead]:
    service = TestimonialService(session)
    return service.list_testimonials(status=status, limit=limit, offset=offset)


@router.patch(
    "/{testimonial_id}",
    response_model=TestimonialRead,
    dependencies=[AdminPrincipal],
    summary="Edit a testimonial and/or set its workflow status (admin)",
)
def update_testimonial(
    testimonial_id: UUID,
    *,
    session: Session = Depends(get_session),
    data_in: TestimonialUpdate,
) -> TestimonialRead:
    """Approve with ``{"status": "approved"}``; only approved items go public."""
    service = TestimonialService(session)
    testimonial = service.update_testimonial(testimonial_id, data_in)
    if testimonial is None:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return testimonial


@router.post(
    "/{testimonial_id}/photo",
    response_model=TestimonialRead,
    dependencies=[AdminPrincipal],
    summary="Attach (or replace) the verified photo (admin)",
)
async def upload_testimonial_photo(
    testimonial_id: UUID,
    session: Session = Depends(get_session),
    photo: UploadFile = File(...),
) -> TestimonialRead:
    """The file is sanitised and re-encoded by ``app.core.media`` before it
    ever touches disk; the previous photo file is deleted on replacement."""
    data = await photo.read()
    photo_url = save_image(data)

    service = TestimonialService(session)
    if service.get_testimonial(testimonial_id) is None:
        delete_image(photo_url)  # don't leave an orphan for a missing row
        raise HTTPException(status_code=404, detail="Testimonial not found")
    previous = service.attach_photo(testimonial_id, photo_url)
    if previous is not None:
        delete_image(previous)
    return service.get_testimonial(testimonial_id)  # type: ignore[return-value]


@router.delete(
    "/{testimonial_id}",
    dependencies=[AdminPrincipal],
    summary="Delete a testimonial and its stored photo (admin)",
)
def delete_testimonial(
    testimonial_id: UUID,
    session: Session = Depends(get_session),
) -> dict[str, str]:
    service = TestimonialService(session)
    result = service.delete_testimonial(testimonial_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    deleted, photo_path = result
    delete_image(photo_path)
    return {"detail": "Testimonial deleted successfully"}
