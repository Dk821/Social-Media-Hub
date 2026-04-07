# Here are your Instructions
python -m venv venv
pip install -r requirements.txt
cd backend 
venv\Scripts\activate 
uvicorn server:app --reload --host 0.0.0.0 --port 8000


cd frontend 
npm install
npm start  
