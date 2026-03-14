from django.db import models

# Create your models here.
from django.db import models

class Category(models.Model):

    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class Product(models.Model):

    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=100, unique=True)

    category = models.ForeignKey(Category, on_delete=models.CASCADE)

    unit = models.CharField(max_length=50)

    reorder_level = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name