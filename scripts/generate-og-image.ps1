$ErrorActionPreference = "Stop"
$outputPath = Join-Path (Split-Path $PSScriptRoot -Parent) "assets\turbine-lab-og.png"

$source = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Text;

public static class TurbineOgImage
{
    private static Color C(string value) { return ColorTranslator.FromHtml(value); }

    private static void AddRoundedRect(GraphicsPath path, Rectangle rect, int radius)
    {
        int diameter = radius * 2;
        path.AddArc(rect.X, rect.Y, diameter, diameter, 180, 90);
        path.AddArc(rect.Right - diameter, rect.Y, diameter, diameter, 270, 90);
        path.AddArc(rect.Right - diameter, rect.Bottom - diameter, diameter, diameter, 0, 90);
        path.AddArc(rect.X, rect.Bottom - diameter, diameter, diameter, 90, 90);
        path.CloseFigure();
    }

    private static void DrawText(Graphics g, string value, float x, float y, float size, FontStyle style, Color color)
    {
        using (var font = new Font("Segoe UI", size, style, GraphicsUnit.Pixel))
        using (var brush = new SolidBrush(color))
            g.DrawString(value, font, brush, x, y);
    }

    public static void Generate(string outputPath)
    {
        const int width = 1200;
        const int height = 630;
        var cyan = C("#62d7db");
        var pale = C("#e8f0f4");
        var muted = C("#a9bdc7");
        var amber = C("#f2b66d");
        var navy = C("#091119");

        using (var bitmap = new Bitmap(width, height, PixelFormat.Format32bppArgb))
        using (var g = Graphics.FromImage(bitmap))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.TextRenderingHint = TextRenderingHint.AntiAliasGridFit;

            using (var background = new LinearGradientBrush(
                new Rectangle(0, 0, width, height), C("#091119"), C("#102733"), 0f))
                g.FillRectangle(background, 0, 0, width, height);

            using (var glow = new SolidBrush(Color.FromArgb(22, cyan)))
                g.FillEllipse(glow, 720, 55, 460, 460);

            using (var gridPen = new Pen(Color.FromArgb(22, 98, 215, 219), 1))
            {
                for (int x = 24; x < width; x += 40) g.DrawLine(gridPen, x, 0, x, height);
                for (int y = 24; y < height; y += 40) g.DrawLine(gridPen, 0, y, width, y);
            }

            using (var mark = new GraphicsPath())
            using (var markBrush = new SolidBrush(cyan))
            using (var markTextBrush = new SolidBrush(navy))
            using (var markFont = new Font("Segoe UI", 34, FontStyle.Bold, GraphicsUnit.Pixel))
            {
                AddRoundedRect(mark, new Rectangle(64, 54, 54, 54), 13);
                g.FillPath(markBrush, mark);
                var format = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("T", markFont, markTextBrush, new RectangleF(64, 51, 54, 58), format);
            }

            DrawText(g, "TURBINE LAB", 138, 64, 23, FontStyle.Bold, pale);
            DrawText(g, "RANKINE CYCLE SIMULATOR", 72, 145, 17, FontStyle.Bold, cyan);
            DrawText(g, "Steam to", 68, 208, 64, FontStyle.Bold, pale);
            DrawText(g, "electricity.", 68, 279, 64, FontStyle.Bold, cyan);
            DrawText(g, "Tune a control. See what changes.", 74, 374, 23, FontStyle.Regular, pale);

            using (var chip = new GraphicsPath())
            using (var chipBrush = new SolidBrush(Color.FromArgb(210, 20, 54, 63)))
            using (var chipPen = new Pen(Color.FromArgb(130, cyan), 1))
            {
                AddRoundedRect(chip, new Rectangle(72, 425, 575, 52), 12);
                g.FillPath(chipBrush, chip);
                g.DrawPath(chipPen, chip);
            }
            DrawText(g, "PRESSURE  /  HEAT  /  WORK  /  POWER", 91, 440, 19, FontStyle.Bold, cyan);

            DrawTurbine(g, 925, 292, cyan, pale, amber);

            using (var rule = new Pen(Color.FromArgb(110, cyan), 1))
                g.DrawLine(rule, 72, 515, 1128, 515);
            DrawText(g, "LIVE MODEL", 74, 540, 16, FontStyle.Bold, cyan);
            DrawText(g, "ENERGY BALANCE", 340, 540, 16, FontStyle.Bold, amber);
            DrawText(g, "CLASSROOM TOOL", 660, 540, 16, FontStyle.Bold, muted);
            DrawText(g, "TURBINE LAB  /  STEAM POWER SIMULATOR", 74, 583, 15, FontStyle.Regular, pale);

            bitmap.Save(outputPath, ImageFormat.Png);
        }
    }

    private static void DrawTurbine(Graphics g, float cx, float cy, Color cyan, Color pale, Color amber)
    {
        using (var outer = new Pen(Color.FromArgb(58, pale), 1))
        using (var ring = new Pen(Color.FromArgb(150, cyan), 2))
        using (var inner = new Pen(Color.FromArgb(74, pale), 1))
        using (var hubFill = new SolidBrush(C("#102733")))
        using (var hubRing = new Pen(cyan, 5))
        using (var hub = new SolidBrush(cyan))
        {
            g.DrawEllipse(outer, cx - 190, cy - 190, 380, 380);
            g.DrawEllipse(ring, cx - 162, cy - 162, 324, 324);
            g.DrawEllipse(inner, cx - 132, cy - 132, 264, 264);
            g.DrawEllipse(new Pen(Color.FromArgb(74, cyan), 2), cx - 116, cy - 116, 232, 232);

            for (int i = 0; i < 12; i++)
            {
                var state = g.Save();
                g.TranslateTransform(cx, cy);
                g.RotateTransform(i * 30f - 13f);
                using (var blade = new GraphicsPath())
                using (var bladeBrush = new SolidBrush(i % 3 == 0 ? Color.FromArgb(235, cyan) : Color.FromArgb(155, pale)))
                {
                    blade.AddPolygon(new[] {
                        new PointF(20, -8), new PointF(119, -17),
                        new PointF(139, 2), new PointF(43, 14)
                    });
                    g.FillPath(bladeBrush, blade);
                }
                g.Restore(state);
            }

            g.FillEllipse(hubFill, cx - 35, cy - 35, 70, 70);
            g.DrawEllipse(hubRing, cx - 28, cy - 28, 56, 56);
            g.FillEllipse(hub, cx - 9, cy - 9, 18, 18);
        }

        using (var steam = new SolidBrush(amber))
        using (var vapor = new SolidBrush(cyan))
        {
            g.FillEllipse(steam, 774, 270, 10, 10);
            g.FillEllipse(vapor, 798, 245, 6, 6);
            g.FillEllipse(steam, 1065, 283, 10, 10);
            g.FillEllipse(vapor, 1044, 317, 6, 6);
            g.FillEllipse(steam, 842, 182, 6, 6);
            g.FillEllipse(vapor, 999, 387, 8, 8);
        }
    }
}
'@

Add-Type -TypeDefinition $source -ReferencedAssemblies System.Drawing
[TurbineOgImage]::Generate($outputPath)
Write-Output "Generated $outputPath (1200 x 630 PNG)"
