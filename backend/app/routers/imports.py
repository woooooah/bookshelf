"""Uvoz knjig in podatkov o branju iz Goodreadsa."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.auth import get_current_user
from app.models import User
from app.schemas import ImportPreview
from app.services.goodreads import NotGoodreadsExport, parse_export

router = APIRouter(prefix="/imports/goodreads", tags=["imports"])

MAX_FILE_SIZE = 5 * 1024 * 1024


@router.post("/preview", response_model=ImportPreview)
async def preview_import(file: UploadFile, user: User = Depends(get_current_user)):
    """Preveri, ali je datoteka Goodreads izvoz, in vrne knjige, ki jih je mogoce uvoziti."""
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "not_goodreads_export")
    content = await file.read(MAX_FILE_SIZE + 1)
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "File is too large")
    try:
        rows, skipped = parse_export(content)
    except NotGoodreadsExport:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "not_goodreads_export")
    return ImportPreview(rows=rows, skipped=skipped)
