import sys
from PIL import Image

def remove_background(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    
    # Get image data
    data = list(img.getdata())
    width, height = img.size
    
    # We'll do a simple heuristic: if a pixel is perfectly white (or very close), 
    # we make it transparent, but ONLY if it's near the edges or we just use flood fill.
    # Actually, PIL ImageDraw floodfill operates on colors.
    # A better approach: Floodfill from the 4 corners.
    from PIL import ImageDraw
    
    # Create a copy to flood fill with a unique transparent color
    transparent = (255, 255, 255, 0)
    
    # We will flood fill starting from (0,0) replacing white with transparent
    # The floodfill in PIL replaces color EXACTLY matching. The background might have slight compression artifacts.
    # Let's do a tolerance-based flood fill manually.
    
    def flood_fill(x, y, target_color, replacement_color, tolerance=10):
        stack = [(x, y)]
        visited = set()
        
        while stack:
            cx, cy = stack.pop()
            if (cx, cy) in visited:
                continue
            visited.add((cx, cy))
            
            idx = cy * width + cx
            r, g, b, a = data[idx]
            
            # Check if within tolerance
            if abs(r - target_color[0]) <= tolerance and \
               abs(g - target_color[1]) <= tolerance and \
               abs(b - target_color[2]) <= tolerance and a > 0:
                
                data[idx] = replacement_color
                
                # Add neighbors
                if cx > 0: stack.append((cx - 1, cy))
                if cx < width - 1: stack.append((cx + 1, cy))
                if cy > 0: stack.append((cx, cy - 1))
                if cy < height - 1: stack.append((cx, cy + 1))

    # Target color is the color of pixel 0,0
    target_color = data[0]
    
    # Flood fill from all 4 corners just in case
    flood_fill(0, 0, target_color, transparent, tolerance=15)
    flood_fill(width-1, 0, target_color, transparent, tolerance=15)
    flood_fill(0, height-1, target_color, transparent, tolerance=15)
    flood_fill(width-1, height-1, target_color, transparent, tolerance=15)
    
    img.putdata(data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    remove_background(sys.argv[1], sys.argv[2])
