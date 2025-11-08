FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["npm", "start"]

