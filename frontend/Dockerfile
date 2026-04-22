FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend application
COPY . .

EXPOSE 3000

# Next.js dev server
CMD ["npm", "run", "dev"]
