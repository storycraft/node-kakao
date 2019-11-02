# NodeKakao - KakaoTalk PC implemention(Loco protocol wrapper)
Note: this implemention is very unstable and can stop working anytime.

## Warning
There are many security issue to use for production (I expect noone would use this anyway :P).  
IV randomzing and many functions that I may not know are disabled or tricked to keep this client simple.

## Unknown parts
How to generate X-VC field. (seems like using user-agent, email, device-uuid)  
How to generate device_uuid by using device ids?  
  
Since X-VC value is related to security.  
You need to extract it somehow.