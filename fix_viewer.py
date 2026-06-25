import re
import sys

def main():
    path = "src/components/ResumeViewer.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # We want to inject the TEST BANNER into the onclone function.
    # Looking for:
    #         onclone: (clonedDoc: Document) => {
    #           clonedDoc.documentElement.lang = lang === "he" ? "he" : "en";
    
    pattern = r'(onclone: \(clonedDoc: Document\) => \{)'
    
    injection = r'''\1
          const banner = clonedDoc.createElement('div');
          banner.style.backgroundColor = 'red';
          banner.style.color = 'white';
          banner.style.fontSize = '40px';
          banner.style.fontWeight = 'bold';
          banner.style.textAlign = 'center';
          banner.style.padding = '20px';
          banner.style.zIndex = '99999';
          banner.style.position = 'absolute';
          banner.style.top = '0';
          banner.style.left = '0';
          banner.style.width = '100%';
          banner.textContent = 'TEST BANNER INJECTED';
          clonedDoc.body.appendChild(banner);
'''
    
    new_content = re.sub(pattern, injection, content, count=1)
    
    if new_content == content:
        print("Failed to inject test banner")
        sys.exit(1)
        
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    
    print("Successfully updated ResumeViewer.tsx")

if __name__ == "__main__":
    main()
