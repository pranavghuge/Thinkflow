from pydantic import BaseModel,EmailStr,Field

class SignupRequest(BaseModel):
    email:EmailStr =Field(...)
    password:str=Field(...,min_length=8)

class LoginRequest(BaseModel):
    email:EmailStr=Field(...)
    password:str=Field(...,min_length=8)

class UserResponse(BaseModel):
    id:int
    email:str    

    class Config:
        from_attributes = True