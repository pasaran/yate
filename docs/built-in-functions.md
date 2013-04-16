# Встроенные функции

* ```html(scalar)``` – возвращает значение "как есть" без каких-либо преобразований, аналог ```disable-output-escaping``` в XSL.
```js
html('<!DOCTYPE html>') // можно использовать для вывода doctype
html('<!-- comment -->') // или HTML-комментариев
```

* ```index()``` – возвращает индекс обрабатываемого элемента массива, аналог ```position()``` в XSL
* ```document(nodeset)``` - преобразует текущий контекст наложения так, что переданный nodeset становится корнем.

К примеру, для данных:
```json
{
  "foo": true,
  "newroot": {
    "foo": false
  }
}
```
и шаблона:
```
match / {
  /.foo
  if (.newroot) {
    apply document(.newroot)
  }
}
```

Получаем результат
```
true
false
```
