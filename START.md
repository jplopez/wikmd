# Starting wikmd

Run these commands from `C:\Users\Juan Pablo Lopez\wikmd` each time you restart your workspace:

```powershell
cd "C:\Users\Juan Pablo Lopez\wikmd"
.\venv\Scripts\Activate.ps1
python -m wikmd.wiki
```

Then open http://localhost:5000 in your browser.

## Notes

- The server runs in the foreground. Keep the terminal open while using the wiki.
- To stop the server press `Ctrl+C` in the terminal.
- Wiki pages (markdown files) are stored in the `wiki/` folder.
- Logs are written to `wikmd.log` in this directory.
