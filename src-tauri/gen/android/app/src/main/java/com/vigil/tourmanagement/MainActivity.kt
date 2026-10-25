package com.vigil.tourmanagement

import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream

class AndroidBridge(private val activity: Activity) {

    @JavascriptInterface
    fun downloadPdf(base64Data: String, filename: String) {
        activity.runOnUiThread {
            try {
                val pdfBytes = Base64.decode(base64Data, Base64.DEFAULT)
                val cleanFilename = if (filename.endsWith(".pdf")) filename else "$filename.pdf"

                var savedUri: Uri? = null

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val contentValues = ContentValues().apply {
                        put(MediaStore.MediaColumns.DISPLAY_NAME, cleanFilename)
                        put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                        put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                    }
                    val resolver = activity.contentResolver
                    val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                    if (uri != null) {
                        resolver.openOutputStream(uri)?.use { out ->
                            out.write(pdfBytes)
                            out.flush()
                        }
                        savedUri = uri
                    }
                } else {
                    val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                    val file = File(downloadsDir, cleanFilename)
                    FileOutputStream(file).use { out ->
                        out.write(pdfBytes)
                        out.flush()
                    }
                    savedUri = FileProvider.getUriForFile(activity, "${activity.packageName}.fileprovider", file)
                }

                Toast.makeText(activity, "PDF saved to Downloads: $cleanFilename", Toast.LENGTH_LONG).show()

                // Prompt user to view the downloaded PDF
                if (savedUri != null) {
                    val viewIntent = Intent(Intent.ACTION_VIEW).apply {
                        setDataAndType(savedUri, "application/pdf")
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    try {
                        activity.startActivity(viewIntent)
                    } catch (_: Exception) {
                        // Fallback if no specific viewer is registered
                    }
                }
            } catch (e: Exception) {
                Toast.makeText(activity, "Failed to save PDF: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    @JavascriptInterface
    fun sharePdf(base64Data: String, filename: String, text: String) {
        activity.runOnUiThread {
            try {
                val pdfBytes = Base64.decode(base64Data, Base64.DEFAULT)
                val cleanFilename = if (filename.endsWith(".pdf")) filename else "$filename.pdf"

                val cacheFile = File(activity.cacheDir, cleanFilename)
                FileOutputStream(cacheFile).use { out ->
                    out.write(pdfBytes)
                    out.flush()
                }

                val contentUri = FileProvider.getUriForFile(
                    activity,
                    "${activity.packageName}.fileprovider",
                    cacheFile
                )

                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "application/pdf"
                    putExtra(Intent.EXTRA_STREAM, contentUri)
                    putExtra(Intent.EXTRA_TEXT, text)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }

                activity.startActivity(Intent.createChooser(shareIntent, "Share Document"))
            } catch (e: Exception) {
                Toast.makeText(activity, "Failed to share PDF: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}

class MainActivity : TauriActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
    }

    override fun onWebViewCreate(webView: WebView) {
        super.onWebViewCreate(webView)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
        webView.clearCache(true)
        webView.addJavascriptInterface(AndroidBridge(this), "AndroidBridge")
    }
}
