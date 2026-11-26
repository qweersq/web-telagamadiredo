# InfoModal Component

Komponen modal yang dapat digunakan secara general untuk menampilkan informasi panduan atau penjelasan.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | - | Status modal (open/close) |
| `onClose` | function | - | Function untuk menutup modal |
| `title` | string | - | Judul modal |
| `items` | array | `[]` | Array objek item untuk ditampilkan |
| `footerInfo` | object | `null` | Informasi tambahan di footer |
| `buttonText` | string | `"Tutup"` | Text pada button |
| `maxWidth` | string | `"max-w-md"` | Max width modal |

## Structure Item Object

```javascript
{
  title: "Judul Item",
  description: "Deskripsi item",
  bgColor: "bg-blue-50",        // Optional: background color
  dotColor: "bg-blue-500",      // Optional: dot color
  titleColor: "text-blue-700"   // Optional: title color
}
```

## Structure FooterInfo Object

```javascript
{
  icon: "📸",                   // Optional: emoji atau icon
  text: "Informasi tambahan"
}
```

## Contoh Penggunaan

### 1. Status Antrian Item
```jsx
<InfoModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Status Antrian Item"
  items={[
    {
      title: "Antrian",
      description: "Item menunggu untuk dikerjakan",
      bgColor: "bg-blue-50",
      dotColor: "bg-blue-500",
      titleColor: "text-blue-700"
    },
    {
      title: "Proses",
      description: "Item sedang dalam pengerjaan",
      bgColor: "bg-yellow-50",
      dotColor: "bg-yellow-500",
      titleColor: "text-yellow-700"
    }
  ]}
  footerInfo={{
    icon: "📸",
    text: "Foto Before & After tersedia untuk setiap item"
  }}
/>
```

### 2. Panduan Fitur
```jsx
<InfoModal
  isOpen={showGuide}
  onClose={() => setShowGuide(false)}
  title="Panduan Fitur"
  items={[
    {
      title: "Tambah Order",
      description: "Klik tombol + untuk menambah order baru"
    },
    {
      title: "Edit Order",
      description: "Klik pada order untuk mengedit detail"
    }
  ]}
  maxWidth="max-w-lg"
/>
```

### 3. Informasi Sederhana
```jsx
<InfoModal
  isOpen={showInfo}
  onClose={() => setShowInfo(false)}
  title="Informasi"
  items={[
    {
      title: "Tips",
      description: "Gunakan fitur ini untuk meningkatkan efisiensi kerja"
    }
  ]}
  buttonText="Mengerti"
/>
```

## Styling

Modal menggunakan:
- Background overlay hitam dengan opacity 50%
- Modal putih dengan rounded corners
- Responsive design dengan padding dari edge
- Konsisten dengan design system aplikasi
- AnimatedButton untuk button actions

## Responsive

Modal akan:
- Tidak lewat batas screen (ada padding)
- Responsif di semua ukuran screen
- Max width dapat disesuaikan dengan prop `maxWidth`
