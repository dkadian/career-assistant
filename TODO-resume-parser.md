# Resume Parser Configuration Plan & Progress

## Approved Plan Steps:

### 1. Update requirements.txt ✅ **DONE**
- Add pdfplumber, anthropic

### 2. Refactor app/services/resume_parser.py ✅ [PENDING]
- Convert CLI to service: parse_resume_from_content(content: bytes, filename: str)
- Remove main()/CLI

### 3. Update app/schemas/schemas.py ✅ [PENDING]
- Add ResumeParsedData model
- Expand ResumeUploadResponse

### 4. Update app/routes/profile.py ✅ [PENDING]
- Use new parser service
- Expand endpoint to save full parsed data

### 5. DB Schema check/update (app/database.py, models.py) ✅ **DONE**
- Add parsed_resume JSON field to user_profiles if needed

### 6. Frontend minor updates (optional) ✅ [PENDING]
- Display more parsed data in ProfileModal

### 7. Test & Install
- pip install -r requirements.txt
- Test /resume upload endpoint
- Test frontend upload



