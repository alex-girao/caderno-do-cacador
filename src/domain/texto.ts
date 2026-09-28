/** "1 item", "3 itens": número seguido da forma certa do substantivo. */
export function quantificar(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`
}
