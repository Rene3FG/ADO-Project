import gspread
from google.oauth2.service_account import Credentials
from loguru import logger
from config import GOOGLE_CREDS_FILE, SPREADSHEET_ID

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
]

class SheetsClient:
    def __init__(self):
        creds = Credentials.from_service_account_file(GOOGLE_CREDS_FILE, scopes=SCOPES)
        self.client = gspread.authorize(creds)
        self.spreadsheet = self.client.open_by_key(SPREADSHEET_ID)
        logger.info(f"Conectado a Google Sheets: {self.spreadsheet.title}")

    def get_sheet(self, nombre: str):
        """Retorna el worksheet por nombre"""
        return self.spreadsheet.worksheet(nombre)

    def read_range(self, sheet_name: str, rango: str) -> list[list]:
        """
        Lee un rango y retorna lista de listas.
        Filas vacías al final son ignoradas.
        Ejemplo: read_range("DIESEL", "A2:F500")
        """
        ws = self.get_sheet(sheet_name)
        values = ws.get(rango, value_render_option="UNFORMATTED_VALUE")
        # Eliminar filas completamente vacías
        return [row for row in values if any(cell != '' for cell in row)]

    def read_cell(self, sheet_name: str, celda: str):
        """
        Lee una celda específica. Ejemplo: read_cell("KPI´S", "B10")
        """
        ws = self.get_sheet(sheet_name)
        return ws.acell(celda, value_render_option="UNFORMATTED_VALUE").value

    def write_row(self, sheet_name: str, fila: int, valores: list):
        """
        Escribe una fila completa. fila es 1-indexed (igual que Sheets).
        Ejemplo: write_row("DIESEL", 3, [789, "11:19:32", True, ...])
        """
        ws = self.get_sheet(sheet_name)
        n_cols = len(valores)
        # Convierte número a letra de columna
        col_final = self._col_num_to_letter(n_cols)
        rango = f"A{fila}:{col_final}{fila}"
        ws.update(rango, [valores], value_input_option="USER_ENTERED")
        logger.debug(f"[PUSH] {sheet_name} fila {fila}: {valores}")

    def append_row(self, sheet_name: str, valores: list) -> int:
        """
        Agrega una nueva fila al final de la hoja.
        Retorna el número de fila donde fue insertada.
        """
        ws = self.get_sheet(sheet_name)
        ws.append_row(valores, value_input_option="USER_ENTERED")
        # gspread no retorna el número de fila directamente; lo calculamos
        return ws.row_count

    def update_cell(self, sheet_name: str, fila: int, col: int, valor):
        """
        Actualiza una sola celda. col es 1-indexed.
        """
        ws = self.get_sheet(sheet_name)
        ws.update_cell(fila, col, valor)

    def get_last_row(self, sheet_name: str, col: int = 1) -> int:
        """
        Retorna el número de la última fila con datos en la columna dada.
        """
        ws = self.get_sheet(sheet_name)
        col_values = ws.col_values(col)
        return len(col_values)

    @staticmethod
    def _col_num_to_letter(n: int) -> str:
        """1→A, 2→B, 26→Z, 27→AA, etc."""
        result = ""
        while n > 0:
            n, rem = divmod(n - 1, 26)
            result = chr(65 + rem) + result
        return result
